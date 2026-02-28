use tauri_plugin_dialog;

use rusqlite::{params_from_iter, Connection, Row};
use serde_json::Value as JsonValue;

#[tauri::command]
fn db_execute(db_path: String, sql: String, params: Vec<JsonValue>) -> Result<(), String> {
  let conn = Connection::open(&db_path)
    .map_err(|e| format!("Erreur ouverture BD ({db_path}): {e}"))?;

  let sqlite_params = json_params_to_sqlite(params);
  let bound_params = params_from_iter(sqlite_params);

  conn.execute(&sql, bound_params)
    .map_err(|e| format!("Erreur execute SQL: {e}"))?;

  Ok(())
}

#[derive(serde::Serialize)]
struct QueryRow {
  values: serde_json::Map<String, JsonValue>,
}

#[tauri::command]
fn db_select(db_path: String, sql: String, params: Vec<JsonValue>) -> Result<Vec<QueryRow>, String> {
  let conn = Connection::open(&db_path)
    .map_err(|e| format!("Erreur ouverture BD ({db_path}): {e}"))?;

  let sqlite_params = json_params_to_sqlite(params);
  let bound_params = params_from_iter(sqlite_params);

  let mut stmt = conn
    .prepare(&sql)
    .map_err(|e| format!("Erreur prepare SQL: {e}"))?;

  let column_names: Vec<String> = stmt
    .column_names()
    .iter()
    .map(|s| s.to_string())
    .collect();

  let rows_iter = stmt
    .query_map(bound_params, |row| row_to_json_row(row, &column_names))
    .map_err(|e| format!("Erreur query_map SQL: {e}"))?;

  let mut result = Vec::new();
  for r in rows_iter {
    let values = r.map_err(|e| format!("Erreur lecture ligne SQL: {e}"))?;
    result.push(QueryRow { values });
  }

  Ok(result)
}

fn json_params_to_sqlite(params: Vec<JsonValue>) -> Vec<rusqlite::types::Value> {
  params
    .into_iter()
    .map(|v| {
      match v {
        JsonValue::Null => rusqlite::types::Value::Null,
        JsonValue::Bool(b) => rusqlite::types::Value::Integer(if b { 1 } else { 0 }),
        JsonValue::Number(n) => {
          if let Some(i) = n.as_i64() {
            rusqlite::types::Value::Integer(i)
          } else if let Some(f) = n.as_f64() {
            rusqlite::types::Value::Real(f)
          } else {
            rusqlite::types::Value::Text(n.to_string())
          }
        }
        JsonValue::String(s) => rusqlite::types::Value::Text(s),
        other => rusqlite::types::Value::Text(other.to_string()),
      }
    })
    .collect()
}

fn row_to_json_row(row: &Row, column_names: &[String]) -> rusqlite::Result<serde_json::Map<String, JsonValue>> {
  let mut map = serde_json::Map::new();
  for (idx, name) in column_names.iter().enumerate() {
    let v: rusqlite::types::Value = row.get(idx)?;
    let json_v = match v {
      rusqlite::types::Value::Null => JsonValue::Null,
      rusqlite::types::Value::Integer(i) => JsonValue::from(i),
      rusqlite::types::Value::Real(f) => JsonValue::from(f),
      rusqlite::types::Value::Text(s) => JsonValue::from(s),
      rusqlite::types::Value::Blob(_) => JsonValue::Null,
    };
    map.insert(name.clone(), json_v);
  }
  Ok(map)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![db_execute, db_select])
    .plugin(tauri_plugin_dialog::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

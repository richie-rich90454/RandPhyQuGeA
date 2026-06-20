// Icons will be added later via `npm run tauri icon`.
// Bundle is currently disabled in tauri.conf.json to avoid missing-icon build errors.

mod commands;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::parse_specification,
            commands::generate_question,
            commands::generate_batch,
            commands::export_questions,
            commands::get_formula_library,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

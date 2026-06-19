// Icons will be added later via `npm run tauri icon`.
// Bundle is currently disabled in tauri.conf.json to avoid missing-icon build errors.

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

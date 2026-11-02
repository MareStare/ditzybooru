use axum::{Router, routing::get};

mod api;
mod cache;
pub mod mapping;
mod sites;

type Result<T = (), E = anyhow::Error> = std::result::Result<T, E>;

pub async fn run() {
    if let Err(err) = try_run().await {
        // TODO: setup logging with the `tracing` crate and push logs to
        // Grafana/Loki via Grafana Alloy
        eprintln!("Error: {err}");
    }
}

async fn try_run() -> Result {
    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .merge(api::router()?);

    // Loopback by default: a reverse proxy is the public entry point.
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_owned());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_owned());
    let addr = format!("{host}:{port}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;

    eprintln!("Listening on {addr}...");
    axum::serve(listener, app).await?;

    Ok(())
}

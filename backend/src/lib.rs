use axum::{Router, routing::get};

type Result<T = (), E = anyhow::Error> = std::result::Result<T, E>;

pub async fn run() {
    if let Err(err) = try_run().await {
        // TODO: setup logging with the `tracing` crate and push logs to
        // Grafana/Loki via Grafana Alloy
        eprintln!("Error: {err}");
    }
}

async fn try_run() -> Result {
    let app = Router::new().route("/", get(|| async { "Hello, World!" }));

    let port = 3000;

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;

    eprintln!("Listening on port {port}...");
    axum::serve(listener, app).await?;

    Ok(())
}

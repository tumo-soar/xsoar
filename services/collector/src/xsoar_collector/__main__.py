import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "xsoar_collector.app:create_app", factory=True, host="0.0.0.0", port=8000, log_config=None
    )

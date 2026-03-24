# JoinMe Backend Service

The following README shows the instructions for setting up the
JoinMe backend locally and for development

## Start Locally

From within the `backend` directory, run:

`fastapi dev`

- This works as long as the `pyproject.toml` points to the correct entry point

## Run on a Server (Exposed to the Web)

To test the application on a Linux server and make it accessible externally, use the `fastapi run` command. By default, this binds to `0.0.0.0` (all available IP addresses):

`fastapi run`

Alternatively, if you want to keep hot-reloading enabled while testing externally:

`fastapi dev --host 0.0.0.0`

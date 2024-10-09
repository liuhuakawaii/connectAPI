job("Build and push Docker") {
    startOn {
        gitPush {
            anyBranchMatching {
                +"main"
            }
        }
    }
    kaniko {
        resources {
            cpu = 8.cpu
            memory = 31000.mb
        }
        build {
            dockerfile = "Dockerfile"
            args["HTTP_PROXY"] = "http://10.219.33.6:8888"
            args["HTTPS_PROXY"] = "http://10.219.33.6:8888"
            args["REACT_APP_SIMPLIFIED_RODIN"] = "false"
            labels["vendor"] = "Deemos"
            registryMirrors {
              +"docker-mirror.deemos.dev"
            }
        }
        push("packages.dev.deemos.com/p/hyperhuman/containers/frontend") {
            tags {
                +"latest"
            }
        }
    }
}

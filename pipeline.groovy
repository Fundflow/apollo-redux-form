properties([disableConcurrentBuilds()])

node {
    try {
        stage('Checkout') {
            checkout scm
        }
        if (!utils.skip()) {
            docker.image("node:8").inside {
                stage('Setup') {
                    git.authenticate()
                    npm.authenticate()
                    retry(3) {
                        sh 'npm install --verbose'
                    }
                }
                stage('Compile') {
                    sh 'npm run compile'
                    sh 'git checkout -- package-lock.json'
                }
                stage('Test') {
                    sh 'CI=true npm run test'
                }
                if (!utils.isPullRequest()) {
                    stage('Publish Version') {
                        String newVersion = npm.version()
                        git.push()
                        git.tag("${newVersion}")
                    }
                }
            }
        }
    } finally {
        deleteDir()
    }
}

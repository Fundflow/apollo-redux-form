properties([
    disableConcurrentBuilds()
])

node {
    String version = ''

    deleteDir()

    stage('Checkout') {
        checkout scm
    }

    // Workaround for https://issues.jenkins-ci.org/browse/JENKINS-35988
    if (!skipBuildIfTriggeredByJenkins()) {

        stage('Build') {
            echo "Building application ..."

            nodejs('nodejs-8.x') {

                // Need this to fetch private github dependencies and version the application
                withCredentials([usernamePassword(credentialsId: 'github-fundflow-jenkins', usernameVariable: 'GITHUB_USER', passwordVariable: 'GITHUB_PASSWORD')]) {
                    sh 'git config --global url."https://${GITHUB_USER}:${GITHUB_PASSWORD}@github.com/".insteadOf "git://github.com/"'
                    sh 'git config --global user.email jenkins@fundflow.de'
                    sh 'git config --global user.name jenkins'
                }

                sh 'npm install --verbose'
                sh 'CI=true npm run test'

                // Workaround for the fact that npm install makes changes to package-lock.json
                sh 'git checkout -- package-lock.json'
                sh 'git checkout -- package.json'

                lastCommit = sh(returnStdout: true, script: "git log -1 --pretty=%B").trim()
                m = lastCommit =~ /^\d+\.\d+\.\d+$/
                isVersionUpdate = m.find()

                // Do not patch if version was changed manually
                if (!isVersionUpdate) {
                    if (env.BRANCH_NAME in ['master']) {
                        sh 'npm version patch'
                    } else {
                        sh 'npm version prepatch'
                    }
                }

                version = sh(returnStdout: true, script: "npm version | grep \"{\" | tr -s ':'  | cut -d \"'\" -f 4").trim()
            }

            echo "Successfully built application version ${version}"
        }

        if (env.BRANCH_NAME in ['master']) {

            stage('Publish Version') {

                echo "Tagging repository and updating package.json with release version ${version} ..."

                // Required due to https://issues.jenkins-ci.org/browse/JENKINS-28335
                withCredentials([usernamePassword(credentialsId: 'github-fundflow-jenkins', usernameVariable: 'GITHUB_USER', passwordVariable: 'GITHUB_PASSWORD')]) {
                    sh 'git config --global url."https://${GITHUB_USER}:${GITHUB_PASSWORD}@github.com/".insteadOf "https://github.com/"'
                    sh """git push origin HEAD:${env.BRANCH_NAME}"""
                    sh """git push origin v${version}"""
                }

            }
        }
    }

    deleteDir()
}

@NonCPS
boolean skipBuildIfTriggeredByJenkins() {
    boolean validChangeDetected = false
    def changeLogSets = currentBuild.changeSets
    for (int i = 0; i < changeLogSets.size(); i++) {
        def entries = changeLogSets[i].items
        for (int j = 0; j < entries.length; j++) {
            def entry = entries[j]
            if (!"jenkins".equals(entry.author.getFullName())) {
                validChangeDetected = true
                println "Changes found by ${entry.author} (${entry.commitId})"
            } else {
                println "Automated change found by Jenkins (${entry.commitId})"
            }
        }
    }

    def buildCauses = currentBuild.rawBuild.getCauses()
    boolean userTriggeredBuild = buildCauses[buildCauses.size()-1] instanceof Cause.UserIdCause

    // We are building if there are some valid changes or if there are no changes
    // (so the build was triggered intentionally or it is the first run)
    if (!validChangeDetected && !userTriggeredBuild) {
        if (changeLogSets.size() != 0) {
            println "Skipping build. No changes from authors other than Jenkins."
            currentBuild.result = currentBuild.rawBuild.getPreviousBuild()?.result?.toString()
            currentBuild.rawBuild.delete()
            return true;
        } else {
            println "No changes found. Assuming manual run of build or first run."
        }
    }

    return false;
}

pipeline {
    agent { docker { image 'node:14-alpine' } }
    stages {
        stage('build') {
            steps {
                sh 'npm install -g gulp-cli'
                sh 'npm install'
            }
        }
      
        stage('test') {
            steps {
                sh 'npm test'
            }
        }
    }
}

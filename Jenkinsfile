pipeline {
    agent { docker { image 'node:14' } }
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
                step([
                  $class: 'CloverPublisher',
                  cloverReportDir: 'coverage',
                  cloverReportFileName: 'clover.xml',
                  healthyTarget: [methodCoverage: 85, conditionalCoverage: 85, statementCoverage: 85], // optional, default is: method=70, conditional=80, statement=80
                  unhealthyTarget: [methodCoverage: 70, conditionalCoverage: 70, statementCoverage: 70], // optional, default is none
                  failingTarget: [methodCoverage: 50, conditionalCoverage: 50, statementCoverage: 50]     // optional, default is none
                ])
            }
        }
    }
}

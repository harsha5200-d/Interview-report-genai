pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Jenkins automatically checks out the code from GitHub based on the job config
                checkout scm
            }
        }
        
        stage('Deploy with Docker Compose') {
            steps {
                // Run the docker-compose commands to build and start the app
                sh 'docker-compose down || true'
                sh 'docker-compose up -d --build'
            }
        }
    }
}

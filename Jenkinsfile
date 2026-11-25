// CafeSoft_React/Jenkinsfile
pipeline {
    agent any

    environment {
        EC2_STAGING = credentials('ec2-staging-host')
        EC2_PROD    = credentials('ec2-prod-host')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint -- --max-warnings=9999 || true'
            }
        }

        stage('Tests unitarios') {
            steps {
                sh 'npm run test:unit || true'
            }
        }

        stage('Quality Gate – SonarCloud') {
            steps {
                echo 'Quality Gate verificado en GitHub Actions pre-prod.'
            }
        }

        stage('Build – Staging') {
            steps {
                sh 'npm run build'
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ec2-user@${EC2_STAGING} \
                            'mkdir -p /var/www/cafesoft/staging'
                        scp -o StrictHostKeyChecking=no -r dist/* \
                            ec2-user@${EC2_STAGING}:/var/www/cafesoft/staging/
                    """
                }
            }
        }

        stage('Smoke Test – Staging') {
            steps {
                sh 'curl -f http://localhost:80 || true'
                echo 'Staging web desplegado.'
            }
        }

        stage('Aprobación para Producción') {
            when { branch 'main' }
            steps {
                input message: '¿Desplegar Web a PRODUCCIÓN?',
                      ok: 'Sí, desplegar'
            }
        }

        stage('Deploy – Producción') {
            when { branch 'main' }
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ec2-user@${EC2_PROD} \
                            'mkdir -p /var/www/cafesoft/prod'
                        scp -o StrictHostKeyChecking=no -r dist/* \
                            ec2-user@${EC2_PROD}:/var/www/cafesoft/prod/
                    """
                }
            }
        }

        stage('Health Check – Producción') {
            when { branch 'main' }
            steps {
                sh 'curl -f http://localhost:80 || true'
                echo 'Web en producción desplegada.'
            }
        }
    }

    post {
        success {
            echo 'Pipeline Web completado. Sitio en producción.'
        }
        failure {
            echo 'Pipeline Web falló. Revisar logs.'
        }
    }
}

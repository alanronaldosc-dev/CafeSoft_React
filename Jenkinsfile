// CafeSoft_React/Jenkinsfile
pipeline {
    agent { docker { image 'node:20-alpine' } }

    environment {
        S3_STAGING = credentials('s3-web-staging')
        S3_PROD    = credentials('s3-web-prod')
        CF_STAGING = credentials('cloudfront-staging')
        CF_PROD    = credentials('cloudfront-prod')
    }

    stages {

        stage('Instalar dependencias') {
            steps { sh 'npm ci' }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint -- --max-warnings=0'
            }
        }

        stage('Tests unitarios') {
            steps {
                sh 'npm run test:unit'
            }
        }

        stage('Quality Gate – SonarCloud') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    sh '''npx sonar-scanner \
                        -Dsonar.projectKey=alanronaldosc-dev_CafeSoft_React \
                        -Dsonar.organization=alanronaldosc-dev \
                        -Dsonar.sources=src'''
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build – Staging') {
            steps {
                sh 'VITE_API_URL=$STAGING_API_URL npm run build'
                sh "aws s3 sync dist/ s3://${S3_STAGING} --delete"
                sh "aws cloudfront create-invalidation --distribution-id ${CF_STAGING} --paths '/*'"
            }
        }

        stage('Smoke Test – Staging') {
            steps {
                sh 'curl -f https://staging.cafesoft.com || exit 1'
            }
        }

        stage('Aprobación para Producción') {
            when { branch 'main' }
            steps {
                input message: '¿Desplegar Web a PRODUCCIÓN?',
                      ok: 'Sí, desplegar'
            }
        }

        stage('Build – Producción') {
            when { branch 'main' }
            steps {
                sh 'VITE_API_URL=$PROD_API_URL npm run build'
                sh "aws s3 sync dist/ s3://${S3_PROD} --delete"
                sh "aws cloudfront create-invalidation --distribution-id ${CF_PROD} --paths '/*'"
            }
        }
    }
}

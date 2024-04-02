pipeline{
    agent any
    tools {nodejs "Node"}
    stages {
        stage('Clone Repository'){
            steps{
                git branch: 'main',
                    url: 'https://github.com/tumzaaa2009/HIE-hosV3.git'
            }
        }
    }
}

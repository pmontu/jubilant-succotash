# jubilant-succotash
AWS Lambda Back end for storing and retrieving images from s3 and dynamodb

## AWS

### Create User, Allocate Permissions and Generate Access Key and Secret
https://console.aws.amazon.com/iam/home
* Click Users
* Click Add User
* Enter User Name and check Access type - Programmatic access, then press Next
* Click Create Group
* Enter Group Name and Select AmazonS3FullAccess and AmazonDynamoDBFullAccess and Create Group
* Select the goup and Click Next
* Click Create User in Review Screen.
* Copy Access key ID and Secret access key(it wont be shown again)

### CLI
`````
mkdir ~/.aws
touch ~/.aws/credentials
`````

replace access-key and secret in your favorite editor
and paste contents in ~/.aws/credentials
```
[default]
aws_access_key_id = <access-key>
aws_secret_access_key = <secret>
```
`pip install awscli`

### S3 Bucket
please replace bucket-name and region
`aws s3 mb s3://<bucket-name> --region <region>`

### DynamoDb Table
please replace table-name and region
`aws dynamodb create-table --table-name <table-name> --region <region> --attribute-definitions AttributeName=FileName,AttributeType=S --key-schema AttributeName=FileName,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5`

### Info
* [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html)
* example region: us-east-2
* bucket name should be unique

### SAM
install sam
```
pyenv shell 3.6.6
pip install --upgrade pip
xcode-select --install
pip install --user aws-sam-cli
```

download dependancies
```
sam init --runtime nodejs
cd jubilant-succotash
npm install
```

please copy Table Name, Bucket Name to template.yaml like below. ([reference](https://stackoverflow.com/a/48139216/553748))
```
AWSTemplateFormatVersion : '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: My first serverless application.
Resources:
  Pictures:
    Type: AWS::Serverless::Function
    Properties:
      Handler: picture.handler
      Runtime: nodejs8.10
      ...
      Environment:
        Variables:
          TABLE_NAME: <table-name>
          BUCKET_NAME: <bucket-name>
```

start project on port 3000.
please replace key and secret.
`sam local start-api`

test the urls on terminal
```
curl -X GET \
  http://localhost:3000/picture

curl -X POST \
  http://localhost:3000/picture \
  -d '{
	"picture": "<base64-encoded-string-of-image>"
}'
```
Info
* use https://www.base64-image.de/ to convert images to base64

Known Issue
* Timeout is set to 30 seconds. change it to a higher value if required.

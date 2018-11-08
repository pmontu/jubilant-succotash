const AWS = require('aws-sdk');
var uuid = require('node-uuid');

const tableName = process.env.TABLE_NAME;
const bucket = process.env.BUCKET_NAME;

var s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();

const createResponse = (statusCode, body) => {
    
    // to restrict the origin for CORS purposes, replace the wildcard
    // origin with a specific domain name
    return {
        statusCode: statusCode,
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }
};

const createEntryInDB = async (fileName) => {
    
    let params = {
        TableName: tableName,
        Item: {"FileName": fileName}
    };
    let data;
    
    try {
        data = await dynamo.put(params).promise();
    }
    catch(err) {
        console.log(`CREATE ITEM FAILED FOR todo_id = ${params.Item.fileName}, WITH ERROR: ${err}`);
        return createResponse(500, err);
    }

    console.log(`CREATE ITEM SUCCEEDED FOR todo_id = ${params.Item.fileName}`);
    return createResponse(200, `TODO item created with todo_id = ${params.Item.fileName}\n`);
};

const getAll = async () => {

    // Get the file Names(Paths)
    let params = {
        TableName: tableName
    };
    console.log(params)
    let data;
    
    try {
        data = await dynamo.scan(params).promise();
    }
    catch(err) {
        console.log(`GET ALL ITEMS FAILED, WITH ERROR: ${err}`);
        return createResponse(500, err);
    }
    
    if (!data.Items) {
        console.log('NO ITEMS FOUND FOR GET ALL API CALL');
        return createResponse(404, 'ITEMS NOT FOUND\n');
    }

    console.log(`RETRIEVED ALL ITEMS SUCCESSFULLY WITH count = ${data.Count}`);

    // Get the Images
    var new_data = [];
    for(var i=0; i<data.Count; i++){
        item = data.Items[i];
        var picParams = {
            "Bucket": bucket,
            "Key": item.FileName
        };
        console.log("GET")
        const val = await s3.getObject(picParams).promise();
        new_data.push({
            fileName: item.FileName,
            picture: val.Body.toString('base64')
        });
    }
    console.log("GET 2")
    return createResponse(200, JSON.stringify(new_data));
};

exports.handler = async (event, context, callback) => {

    let id =  (event.pathParameters || {}).picture || false;
    switch(event.httpMethod){

        case "GET":
            return await getAll();

        case "POST":
            let encodedImage = JSON.parse(event.body).picture;
            // encodedImage = encodedImage.replace("data:image/jpeg;base64,","");
            let decodedImage = Buffer.from(encodedImage, 'base64');
            var uuid4 = uuid.v4();
            var fileName = "avatar/" + uuid4 + ".jpg"
            var params = {
                "Body": decodedImage,
                "Bucket": bucket,
                "Key": fileName  
            };
            console.log("POST before upload")
            await s3.upload(params).promise();
            console.log("POST before creating entry in db")
            await createEntryInDB(fileName);
            console.log("POST complete")
            return createResponse(200, "uploaded");

        case "PATCH":
            return  {body: "This is a PATCH operation on picture ID " + id};

    }

}
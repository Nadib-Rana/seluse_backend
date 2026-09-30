const { Client } = require('minio');
const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
});
const stream = minioClient.listObjects('seluse-uploads', 'uploads/', true);
stream.on('data', function(obj) { console.log(obj); });
stream.on('error', function(err) { console.log(err); });

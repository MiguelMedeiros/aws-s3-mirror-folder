# AWS S3 Mirror Folder
Author: [Miguel Medeiros](https://www.miguelmedeiros.com.br)

This project helps you to transfer all files from a specific folder on your machine to a Bucket on AWS S3.


## Installation

Install all the dependencies:

`npm install` or `yarn install`

Configure the file: `./config.json`
```
{
  "bucketName": "name-of-your-bucket",
  "accessKeyId": "XXXXXXXXXXXXXXXXXX",
  "secretAccessKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "region": "us-east-1",
  "folder": "images"
}
```


## How to run

#### ...with NPM
`npm start`

And if you want to sync all files:

`npm run sync-all`

#### ...with Yarn
`yarn start`

And if you want to sync all files:

`yarn sync-all`


## Donation
If you like it, you can pay me a beer! :beer:

Bitcoin: 18kXMmrDtgfeQgVmwfmygTaYLyQuVS4chK

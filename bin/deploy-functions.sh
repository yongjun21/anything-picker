#!/usr/bin/env bash
cd functions
export AWS_PROFILE=yongjun21

function deploy {
  cd $1
  zip -r package.zip ./*
  aws lambda update-function-code --function-name $1 --zip-file fileb://package.zip --publish
  rm package.zip
  cd ..
}

if [ $# -gt 0 ]
then
  for function in $@
  do
    deploy $function
  done
else
  for function in *
  do
    deploy $function
  done
fi

import {Bucket, BucketProps} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import {BucketObject} from '../stacks/BucketStack';

export const createBucket = (scope: Construct, bucketObject: BucketObject): Bucket  => {
  const { id, bucketName } = bucketObject;
  return new Bucket(scope, id , {
    versioned: true,
    bucketName,
  });
};

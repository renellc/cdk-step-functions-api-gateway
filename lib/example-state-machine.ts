import { Construct } from "constructs";
import {
  Choice,
  Condition,
  Fail,
  LogLevel,
  StateMachine,
  StateMachineType,
  Succeed
} from "aws-cdk-lib/aws-stepfunctions";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { LogGroup } from "aws-cdk-lib/aws-logs";

import * as path from "path";


/**
 * An example state machine that executes a series of Lambda functions synchronously, with branching paths along the
 * way.
 */
export class ExampleStateMachine extends Construct {
  public readonly stateMachine: StateMachine;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const baseLambdaPath = path.resolve(__dirname, "..", "lambda");
    const commonFunctionProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      bundling: { minify: true },
      memorySize: 128,
      timeout: Duration.seconds(10),
    };

    // Define our functions that'll be used in our state machine
    const stepOne = new NodejsFunction(this, "StepOne", {
      ...commonFunctionProps,
      entry: path.join(baseLambdaPath, "stepOne", "index.ts"),
    });

    const stepTwo = new NodejsFunction(this, "StepTwo", {
      ...commonFunctionProps,
      entry: path.join(baseLambdaPath, "stepTwo", "index.ts"),
    });

    const stepThree = new NodejsFunction(this, "StepThree", {
      ...commonFunctionProps,
      entry: path.join(baseLambdaPath, "stepThree", "index.ts"),
    });

    // Define our final states
    const failState = new Fail(this, "FailState", { error: "Failed", cause: "Number not greater than 50" });
    const succeedState = new Succeed(this, "SucceedState");

    // Define our tasks
    const stepOneState = new LambdaInvoke(this, "StepOneState", {
      lambdaFunction: stepOne,
      outputPath: "$.Payload",  // Here, we only care about the Payload being the input for the next step
    });

    const stepTwoState = new LambdaInvoke(this, "StepTwoState", {
      lambdaFunction: stepTwo,
      outputPath: "$.Payload",
    });

    const stepThreeState = new LambdaInvoke(this, "StepThreeState", {
      lambdaFunction: stepThree,
      outputPath: "$.Payload",
    });

    // Define the steps in the state machine
    stepOneState.next(
      new Choice(this, "ChoiceAfterStepOne")
        .when(Condition.stringEquals("$.status", "FAILED"), failState)
        .otherwise(stepTwoState)
    );

    stepTwoState.next(
      new Choice(this, "ChoiceAfterStepTwo")
        .when(Condition.stringEquals("$.status", "FAILED"), failState)
        .otherwise(stepThreeState),
    );

    stepThreeState.next(succeedState);

    // This log group is optional, but helpful to see the progress of the state machine, as well as each input for
    // each step.
    const stateMachineLogGroup = new LogGroup(this, "StateMachineLogGroup");
    this.stateMachine = new StateMachine(this, "StateMachine", {
      stateMachineType: StateMachineType.EXPRESS,
      definition: stepOneState,
      logs: {
        includeExecutionData: true,
        level: LogLevel.ALL,
        destination: stateMachineLogGroup,
      }
    });
  }
}

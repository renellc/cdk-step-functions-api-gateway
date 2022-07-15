import { APIGatewayEvent } from "aws-lambda";


export const handler = async (event: APIGatewayEvent) => {
  console.info(JSON.stringify(event));
  if (!event.body) {
    return {
      status: "FAILED",
      value: undefined,
    };
  }

  const body: any = event.body;
  if (typeof body !== "object" || !body.value) {
    return {
      status: "FAILED",
      value: undefined,
    };
  }

  return {
    status: "SUCCEED",
    value: body.value,
  };
};

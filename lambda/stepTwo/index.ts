export const handler = async (event: any) => {
  console.info(JSON.stringify(event));

  if (event.value >= 50) {
    return {
      status: "SUCCEED",
      value: event.value,
    };
  } else {
    return {
      status: "FAILED",
      value: event.value,
    };
  }
}
export const handler = async (event: any) => {
  console.info(JSON.stringify(event));
  return {
    message: `Congratulations, you're number ${event.value} is over 50!`,
  };
};

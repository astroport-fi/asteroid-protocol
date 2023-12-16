export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // Simulate a delay of ms
    setTimeout(() => {
      // This code will be executed after ms
      console.log('Delay completed');
      resolve();
    }, ms);
  });
}
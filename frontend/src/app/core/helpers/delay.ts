export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // Simulate a delay of ms
    setTimeout(() => {
      // This code will be executed after ms
      resolve();
    }, ms);
  });
}


export function formatDate(date: Date) {
  const pad = (num: number) => (num < 10 ? '0' + num : num);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // getMonth() returns 0-11
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
export function printMatrix(matrix: number[][]): void {
  let text: string = "";
  matrix.forEach(row => {
    text += "[";
    row.forEach(value => {
      text += value;
    });
    text += "]\n";
  });
  console.log(text);
}

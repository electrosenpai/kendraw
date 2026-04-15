import { Matrix } from 'ml-matrix';

type SparseMatrixOptions = {
  initialCapacity?: number;
  threshold?: number;
};

type SparseMatrixData = Matrix | number[][];

export default class SparseMatrix extends Matrix {
  constructor(rows: number, columns: number, options?: SparseMatrixOptions);
  constructor(data: SparseMatrixData, options?: SparseMatrixOptions);
  constructor(
    rowsOrData: number | SparseMatrixData,
    columnsOrOptions?: number | SparseMatrixOptions,
    maybeOptions?: SparseMatrixOptions,
  ) {
    if (typeof rowsOrData === 'number') {
      const columns = typeof columnsOrOptions === 'number' ? columnsOrOptions : rowsOrData;
      super(rowsOrData, columns);
      return;
    }

    const options = resolveSparseMatrixOptions(columnsOrOptions, maybeOptions);
    const source = Matrix.isMatrix(rowsOrData) ? rowsOrData.to2DArray() : rowsOrData;
    super(applyThreshold(source, options.threshold));
  }

  static eye(rows: number, columns = rows, value = 1) {
    return new SparseMatrix(Matrix.eye(rows, columns, value).to2DArray());
  }

  forEachNonZero(callback: (row: number, column: number, value: number) => number) {
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const value = this.get(row, column);
        if (value === 0) {
          continue;
        }

        const nextValue = callback(row, column, value);
        if (nextValue !== value) {
          this.set(row, column, nextValue);
        }
      }
    }

    return this;
  }
}

export { SparseMatrix };

function resolveSparseMatrixOptions(
  columnsOrOptions?: number | SparseMatrixOptions,
  maybeOptions?: SparseMatrixOptions,
) {
  if (typeof columnsOrOptions === 'object') {
    return columnsOrOptions;
  }

  return maybeOptions ?? {};
}

function applyThreshold(data: number[][], threshold = 0) {
  if (threshold <= 0) {
    return data;
  }

  return data.map((row) => row.map((value) => (Math.abs(value) <= threshold ? 0 : value)));
}

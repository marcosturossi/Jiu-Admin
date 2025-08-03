export enum OperationEnum{
  gt = "gt",
  eq = "eq",
  lt = "lt",
  is_not = "is_not",
  like = "like",
}

export interface FilterInterface{
    key:string
    operation: OperationEnum
    value:string
}

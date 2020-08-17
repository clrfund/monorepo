import { Project } from './projects'

export interface CartItem extends Project {
  amount: number;
}

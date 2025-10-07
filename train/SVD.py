from typing import List, Tuple
import ast
import numpy as np

class SVD: 
    def __init__(self, users: List[Tuple[str, List[float]]], items: List[Tuple[str, List[float]]], feedback: List[Tuple[str, str, int]]):
        self.users = dict(users)
        for k, v in self.users.items():
            self.users[k] = np.array(ast.literal_eval(v), dtype = np.float32)
        self.items = dict(items)
        for k, v in self.items.items():
            self.items[k] = np.array(ast.literal_eval(v), dtype = np.float32)
        self.feedback = feedback
    
    def stochastic_gradient_descent(self, n_epochs, learning_rate = 0.005, regularzation = 0.02):
        
    
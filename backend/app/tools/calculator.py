"""
backend/app/tools/calculator.py

Safe mathematical computation tool for Citizen AI.
Allows citizens to compute scheme installment allocations, loan interest subventions,
and monthly subsidies without risking LLM arithmetic hallucinations.
"""

import ast
import operator
import math
from typing import Dict, Any
from loguru import logger

# Safe allowed math operations
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval(node):
    """Recursively evaluates AST math expressions safely without using arbitrary eval()."""
    if isinstance(node, ast.Constant):  # Python 3.8+
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant type: {type(node.value)}")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            left = _safe_eval(node.left)
            right = _safe_eval(node.right)
            if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and right == 0:
                raise ZeroDivisionError("Division by zero")
            return SAFE_OPERATORS[op_type](left, right)
        raise ValueError(f"Unsupported binary operator: {op_type}")
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            operand = _safe_eval(node.operand)
            return SAFE_OPERATORS[op_type](operand)
        raise ValueError(f"Unsupported unary operator: {op_type}")
    else:
        raise ValueError(f"Unsupported expression element: {type(node)}")


def calculate_expression(expression_str: str) -> Dict[str, Any]:
    """
    Parses and calculates an arithmetic expression safely using AST.
    Example: calculate_expression("6000 / 3") -> {"result": 2000.0, "success": True}
    """
    try:
        # Clean query string to extract math symbols
        clean_expr = expression_str.replace("₹", "").replace("Rs", "").replace("rs", "").replace(",", "").strip()
        
        # Remove trailing equals sign or question marks
        clean_expr = clean_expr.rstrip(" =?")
        
        parsed = ast.parse(clean_expr, mode="eval")
        result = _safe_eval(parsed.body)
        
        # Format integer results cleanly
        if isinstance(result, float) and result.is_integer():
            result = int(result)
            
        return {
            "success": True,
            "expression": clean_expr,
            "result": result,
            "formatted": f"{result:,}" if isinstance(result, (int, float)) else str(result)
        }
    except Exception as e:
        logger.debug(f"Calculator parse note for '{expression_str}': {e}")
        return {
            "success": False,
            "error": str(e)
        }

package com.bookhub.entities;

public enum LoanStatus {
    ACTIVE("Ativo"),
    RETURNED("Devolvido"),
    OVERDUE("Atrasado"),
    LOST("Perdido");

    private final String description;

    LoanStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
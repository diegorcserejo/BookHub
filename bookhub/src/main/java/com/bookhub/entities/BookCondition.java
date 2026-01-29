package com.bookhub.entities;

public enum BookCondition {
    NEW("Novo"),
    LIKE_NEW("Como novo"),
    GOOD("Bom"),
    FAIR("Razoável"),
    POOR("Ruim");

    private final String description;

    BookCondition(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
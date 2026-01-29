package com.bookhub.entities;

public enum ReadingStatus {
    WANT_TO_READ("Quero Ler"),
    READING("Lendo"),
    READ("Lido"),
    ABANDONED("Abandonado");

    private final String description;

    ReadingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

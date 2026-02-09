package com.bookhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@SpringBootApplication
@RestController
@CrossOrigin("*")
public class App {

    private List<Map<String, Object>> livros = new ArrayList<>();

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
        System.out.println("✅ BookHub iniciado: http://localhost:8080");
        System.out.println("📚 API: http://localhost:8080/api/livros");
        System.out.println("🏥 Saúde: http://localhost:8080/health");
    }

    @GetMapping("/")
    public String home() {
        return "<h1>BookHub API</h1><p>Tudo funcionando!</p>";
    }

    @GetMapping("/health")
    public String health() {
        return "✅ ONLINE";
    }

    @GetMapping("/api/livros")
    public List<Map<String, Object>> getLivros() {
        return livros;
    }

    @PostMapping("/api/livros")
    public Map<String, Object> addLivro(@RequestBody Map<String, Object> livro) {
        livro.put("id", System.currentTimeMillis());
        livros.add(livro);
        return livro;
    }

    @GetMapping("/test")
    public String test() {
        livros.add(Map.of(
                "id", 1,
                "titulo", "Livro Teste",
                "autor", "Autor Teste",
                "status", "READING"
        ));
        return "✅ Teste OK! Livros: " + livros.size();
    }
}
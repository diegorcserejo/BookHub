package com.bookhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@SpringBootApplication
@RestController
@CrossOrigin("*")
public class SimpleApp {

    private List<Map<String, Object>> livros = new ArrayList<>();

    public static void main(String[] args) {
        SpringApplication.run(SimpleApp.class, args);
        System.out.println("✅ SERVIDOR RODANDO EM: http://localhost:8080");
    }

    @GetMapping("/")
    public String home() {
        return "<h1>BookHub API</h1><p>Endpoints:</p><ul>" +
                "<li><a href='/api/livros'>/api/livros</a> - GET livros</li>" +
                "<li><a href='/health'>/health</a> - Verificar saúde</li>" +
                "</ul>";
    }

    @GetMapping("/health")
    public String health() {
        return "✅ BookHub Online!";
    }

    @GetMapping("/api/livros")
    public List<Map<String, Object>> getLivros() {
        return livros;
    }

    @PostMapping("/api/livros")
    public Map<String, Object> addLivro(@RequestBody Map<String, Object> livro) {
        livro.put("id", System.currentTimeMillis());
        livro.put("data", new Date());
        livros.add(livro);
        return livro;
    }

    // Endpoint para adicionar livros de exemplo
    @PostMapping("/api/livros/exemplo")
    public String addExemplo() {
        List<Map<String, Object>> exemplos = Arrays.asList(
                Map.of("titulo", "O Pequeno Príncipe", "autor", "Antoine", "status", "READING"),
                Map.of("titulo", "1984", "autor", "George Orwell", "status", "READ"),
                Map.of("titulo", "Harry Potter", "autor", "J.K. Rowling", "status", "WANT_TO_READ")
        );

        for (Map<String, Object> livro : exemplos) {
            livro.put("id", System.currentTimeMillis() + Math.random());
            livro.put("data", new Date());
            livros.add(livro);
        }

        return "✅ Livros de exemplo adicionados!";
    }
}
package com.bookhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "*")
public class BookHubApplication {

	private List<Map<String, Object>> livros = new ArrayList<>();
	private long idCounter = 1;

	public static void main(String[] args) {
		SpringApplication.run(BookHubApplication.class, args);
		System.out.println("🚀 BookHub iniciado com sucesso!");
		System.out.println("📍 URL: http://localhost:8080");
		System.out.println("📍 API: http://localhost:8080/api/livros");
		System.out.println("📍 Teste: http://localhost:8080/health");
	}

	@GetMapping("/health")
	public String health() {
		return "✅ BookHub API está funcionando!";
	}

	// API de Livros
	@GetMapping("/api/livros")
	public List<Map<String, Object>> getLivros() {
		return livros;
	}

	@GetMapping("/api/livros/{id}")
	public Map<String, Object> getLivro(@PathVariable Long id) {
		return livros.stream()
				.filter(l -> id.equals(l.get("id")))
				.findFirst()
				.orElseThrow(() -> new RuntimeException("Livro não encontrado"));
	}

	@PostMapping("/api/livros")
	public Map<String, Object> createLivro(@RequestBody Map<String, Object> livro) {
		livro.put("id", idCounter++);
		livro.put("dataCriacao", new Date());
		livros.add(livro);
		return livro;
	}

	@PutMapping("/api/livros/{id}")
	public Map<String, Object> updateLivro(@PathVariable Long id, @RequestBody Map<String, Object> livroAtualizado) {
		Map<String, Object> livro = getLivro(id);
		livro.putAll(livroAtualizado);
		livro.put("dataAtualizacao", new Date());
		return livro;
	}

	@DeleteMapping("/api/livros/{id}")
	public String deleteLivro(@PathVariable Long id) {
		livros.removeIf(l -> id.equals(l.get("id")));
		return "Livro removido com sucesso";
	}

	@GetMapping("/api/stats")
	public Map<String, Object> getStats() {
		Map<String, Object> stats = new HashMap<>();
		stats.put("totalLivros", livros.size());
		stats.put("lendo", livros.stream().filter(l -> "READING".equals(l.get("status"))).count());
		stats.put("lidos", livros.stream().filter(l -> "READ".equals(l.get("status"))).count());
		stats.put("desejados", livros.stream().filter(l -> "WANT_TO_READ".equals(l.get("status"))).count());
		stats.put("timestamp", new Date());
		return stats;
	}
}
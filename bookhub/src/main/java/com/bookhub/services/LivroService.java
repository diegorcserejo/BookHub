package com.bookhub.services;

import com.bookhub.entities.Livro;
import com.bookhub.entities.enums.ReadingStatus;
import com.bookhub.repositories.LivroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LivroService {

    @Autowired
    private LivroRepository livroRepository;

    public List<Livro> findAll() {
        return livroRepository.findAll();
    }

    public Livro findById(Long id) {
        return livroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Livro não encontrado com id: " + id));
    }

    public Livro save(Livro livro) {
        return livroRepository.save(livro);
    }

    public Livro update(Long id, Livro livroDetails) {
        Livro livro = findById(id);

        livro.setTitulo(livroDetails.getTitulo());
        livro.setAutor(livroDetails.getAutor());
        livro.setStatus(livroDetails.getStatus());
        livro.setCoverUrl(livroDetails.getCoverUrl());
        livro.setAno_publicado(livroDetails.getAno_publicado());
        livro.setPaginas(livroDetails.getPaginas());
        livro.setSynopsis(livroDetails.getSynopsis());
        livro.setIsbn(livroDetails.getIsbn());
        livro.setCondition(livroDetails.getCondition());
        livro.setRating(livroDetails.getRating());
        livro.setStartDate(livroDetails.getStartDate());
        livro.setFinishDate(livroDetails.getFinishDate());
        livro.setNotes(livroDetails.getNotes());

        return livroRepository.save(livro);
    }

    public void delete(Long id) {
        Livro livro = findById(id);
        livroRepository.delete(livro);
    }

    public List<Livro> findByStatus(String status) {
        return livroRepository.findByStatus(ReadingStatus.valueOf(status.toUpperCase()));
    }

    public Map<String, Object> getStatistics() {
        List<Livro> todosLivros = findAll();

        long total = todosLivros.size();
        long lendo = todosLivros.stream()
                .filter(l -> l.getStatus() == ReadingStatus.READING)
                .count();
        long lidos = todosLivros.stream()
                .filter(l -> l.getStatus() == ReadingStatus.READ)
                .count();
        long queroLer = todosLivros.stream()
                .filter(l -> l.getStatus() == ReadingStatus.WANT_TO_READ)
                .count();
        long abandonados = todosLivros.stream()
                .filter(l -> l.getStatus() == ReadingStatus.ABANDONED)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("lendo", lendo);
        stats.put("lidos", lidos);
        stats.put("queroLer", queroLer);
        stats.put("abandonados", abandonados);

        return stats;
    }
}
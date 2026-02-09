package com.bookhub.repositories;

import com.bookhub.entities.Livro;
import com.bookhub.entities.enums.ReadingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivroRepository extends JpaRepository<Livro, Long> {
    List<Livro> findByStatus(ReadingStatus status);
}
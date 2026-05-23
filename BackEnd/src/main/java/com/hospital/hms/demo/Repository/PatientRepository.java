package com.hospital.hms.demo.Repository;

import com.hospital.hms.demo.Entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByNameIgnoreCase(String name);
}
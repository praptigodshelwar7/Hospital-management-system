package com.hospital.hms.demo.Controller;

import com.hospital.hms.demo.Entity.Patient;
import com.hospital.hms.demo.Repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private static final int MAX_BEDS = 30;

    private final PatientRepository repo;

    public PatientController(PatientRepository repo) {
        this.repo = repo;
    }

    // ─── POST /api/patients  —  Admit ─────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> admitPatient(@RequestBody Patient patient) {

        // Validations
        if (patient.getName() == null || patient.getName().isBlank())
            return badRequest("Patient name must not be empty.");
        if (patient.getWard() == null || patient.getWard().isBlank())
            return badRequest("Ward type must not be empty.");
        if (!patient.getWard().equalsIgnoreCase("ICU")
                && !patient.getWard().equalsIgnoreCase("General"))
            return badRequest("Ward must be 'ICU' or 'General'.");
        if (patient.getAge() != null && (patient.getAge() < 0 || patient.getAge() > 150))
            return badRequest("Age must be between 0 and 150.");

        // Bed capacity check
        long occupied = repo.count();
        if (occupied >= MAX_BEDS)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "All " + MAX_BEDS + " beds are currently occupied."));

        // Auto-assign next free bed number (1–30)
        List<Integer> takenBeds = repo.findAll()
                .stream().map(Patient::getBedNumber).toList();
        int nextBed = 1;
        while (takenBeds.contains(nextBed)) nextBed++;

        patient.setWard(capitalize(patient.getWard()));
        patient.setHours(0);
        patient.setBedNumber(nextBed);

        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(patient));
    }

    // ─── GET /api/patients  —  List all ──────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(repo.findAll());
    }

    // ─── DELETE /api/patients/{name}?hours=N  —  Discharge ───────────────────
    //
    // Accepts hours as a query param, updates them, calculates the bill,
    // deletes the record, and returns the full discharge summary in one call.

    @DeleteMapping("/{name}")
    public ResponseEntity<?> dischargePatient(
            @PathVariable String name,
            @RequestParam(defaultValue = "0") int hours) {

        if (hours < 0) return badRequest("Hours cannot be negative.");

        return repo.findByNameIgnoreCase(name)
                .<ResponseEntity<?>>map(patient -> {
                    if (hours > 0) patient.setHours(hours);

                    int finalHours = patient.getHours();
                    String ward    = patient.getWard();
                    int rate       = ward.equalsIgnoreCase("ICU") ? 1000 : 500;
                    int bill       = finalHours * rate;

                    repo.delete(patient);

                    return ResponseEntity.ok(Map.of(
                            "name",      patient.getName(),
                            "age",       patient.getAge() != null ? patient.getAge() : 0,
                            "ward",      ward,
                            "diagnosis", patient.getDiagnosis(),
                            "bedNumber", patient.getBedNumber(),
                            "hours",     finalHours,
                            "ratePerHr", rate,
                            "totalBill", bill
                    ));
                })
                .orElseGet(() -> notFound("Patient not found: " + name));
    }

    // ─── Exception handler ────────────────────────────────────────────────────

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Unexpected error"));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, String>> badRequest(String msg) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", msg));
    }

    private ResponseEntity<Map<String, String>> notFound(String msg) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", msg));
    }

    private String capitalize(String s) {
        return s == null || s.isEmpty() ? s
                : Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }
}
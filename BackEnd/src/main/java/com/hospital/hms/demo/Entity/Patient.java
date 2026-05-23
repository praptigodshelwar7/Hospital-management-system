package com.hospital.hms.demo.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String ward;

    private Integer age;
    private String  diagnosis;

    @Column(nullable = false)
    private Integer bedNumber = 0;

    @Column(nullable = false)
    private Integer hours = 0;

    public Patient() {}

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long    getId()        { return id; }
    public String  getName()      { return name; }
    public String  getWard()      { return ward; }
    public Integer getAge()       { return age; }
    public String  getDiagnosis() { return diagnosis != null ? diagnosis : ""; }
    public int     getBedNumber() { return bedNumber == null ? 0 : bedNumber; }
    public int     getHours()     { return hours    == null ? 0 : hours; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setId(Long id)              { this.id = id; }
    public void setName(String name)        { this.name = name; }
    public void setWard(String ward)        { this.ward = ward; }
    public void setAge(Integer age)         { this.age = (age != null && age > 0) ? age : null; }
    public void setDiagnosis(String d)      { this.diagnosis = d; }
    public void setBedNumber(Integer bed)   { this.bedNumber = (bed == null) ? 0 : bed; }
    public void setHours(Integer hours)     { this.hours = (hours == null || hours < 0) ? 0 : hours; }
}
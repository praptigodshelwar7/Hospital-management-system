package com.hospital.hms.demo.Config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Programmatic Jackson configuration.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The `Patient` entity originally had `private int hours` (primitive).
 * When the frontend POST body omits the `hours` field, Jackson tries to
 * assign null → int, which is illegal in Java:
 *
 *   "JSON parse error: Cannot map `null` into type `int`
 *    (set DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES to 'false' to allow)"
 *
 * This config disables that strict check globally so missing numeric fields
 * fall back to their Java default (0 for int/Integer) instead of throwing.
 *
 * NOTE: Also change `private int hours` → `private Integer hours = 0`
 *       in Patient.java for a complete fix (see Patient.java).
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                // Core fix: null JSON field → primitive int becomes 0, not a crash
                .configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false)

                // Don't crash on unknown JSON fields (future-proofing)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

                // Treat single-value arrays as the value itself
                .configure(DeserializationFeature.UNWRAP_SINGLE_VALUE_ARRAYS, true);
    }
}
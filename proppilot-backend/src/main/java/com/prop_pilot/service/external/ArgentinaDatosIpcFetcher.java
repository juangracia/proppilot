package com.prop_pilot.service.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ArgentinaDatosIpcFetcher implements ExternalIndexFetcher {

    private static final String API_URL = "https://api.argentinadatos.com/v1/finanzas/indices/inflacion";
    private static final String SOURCE = "argentinadatos.com";

    private final WebClient webClient;

    public ArgentinaDatosIpcFetcher(WebClient webClient) {
        this.webClient = webClient;
    }

    @Override
    public List<IndexType> getSupportedIndexTypes() {
        return List.of(IndexType.IPC);
    }

    @Override
    public String getCountryCode() {
        return "AR";
    }

    @Override
    public List<IndexValue> fetchLatestValues() {
        List<IndexValue> allValues = fetchAllHistoricalValues();
        if (allValues.isEmpty()) {
            return allValues;
        }
        // Return only the latest value
        return List.of(allValues.get(allValues.size() - 1));
    }

    @Override
    public List<IndexValue> fetchAllHistoricalValues() {
        List<IndexValue> results = new ArrayList<>();

        try {
            List<IpcResponse> responses = webClient.get()
                .uri(API_URL)
                .retrieve()
                .bodyToFlux(IpcResponse.class)
                .collectList()
                .block();

            if (responses != null && !responses.isEmpty()) {
                for (IpcResponse response : responses) {
                    if (response.getFecha() != null && response.getValor() != null) {
                        IndexValue indexValue = IndexValue.builder()
                            .indexType(IndexType.IPC)
                            .countryCode(getCountryCode())
                            .valueDate(response.getFecha())
                            .value(response.getValor())
                            .source(SOURCE)
                            .build();
                        results.add(indexValue);
                    }
                }
                // Sort by date ascending
                results.sort((a, b) -> a.getValueDate().compareTo(b.getValueDate()));
                log.info("Fetched {} IPC historical values from ArgentinaDatos", results.size());
            }
        } catch (Exception e) {
            log.error("Error fetching IPC from ArgentinaDatos: {}", e.getMessage(), e);
        }

        return results;
    }

    @Data
    public static class IpcResponse {
        @JsonProperty("fecha")
        private LocalDate fecha;
        @JsonProperty("valor")
        private BigDecimal valor;
    }
}

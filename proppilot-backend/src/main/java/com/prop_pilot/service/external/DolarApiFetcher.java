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
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DolarApiFetcher implements ExternalIndexFetcher {

    private static final String API_URL = "https://dolarapi.com/v1/dolares";
    private static final String SOURCE = "dolarapi.com";

    private static final Map<String, IndexType> CASA_TO_INDEX = Map.of(
        "blue", IndexType.DOLAR_BLUE,
        "bolsa", IndexType.DOLAR_MEP,
        "oficial", IndexType.DOLAR_OFICIAL
    );

    private final WebClient webClient;

    public DolarApiFetcher(WebClient webClient) {
        this.webClient = webClient;
    }

    @Override
    public List<IndexType> getSupportedIndexTypes() {
        return List.of(IndexType.DOLAR_BLUE, IndexType.DOLAR_MEP, IndexType.DOLAR_OFICIAL);
    }

    @Override
    public String getCountryCode() {
        return "AR";
    }

    @Override
    public List<IndexValue> fetchLatestValues() {
        List<IndexValue> results = new ArrayList<>();

        try {
            List<DolarApiResponse> responses = webClient.get()
                .uri(API_URL)
                .retrieve()
                .bodyToFlux(DolarApiResponse.class)
                .collectList()
                .block();

            if (responses != null) {
                for (DolarApiResponse response : responses) {
                    IndexType indexType = CASA_TO_INDEX.get(response.getCasa());
                    if (indexType != null && response.getVenta() != null) {
                        LocalDate valueDate = response.getFechaActualizacion() != null
                            ? response.getFechaActualizacion().toLocalDate()
                            : LocalDate.now();

                        IndexValue indexValue = IndexValue.builder()
                            .indexType(indexType)
                            .countryCode(getCountryCode())
                            .valueDate(valueDate)
                            .value(response.getVenta())
                            .source(SOURCE)
                            .rawResponse(response.toString())
                            .build();

                        results.add(indexValue);
                        log.info("Fetched {} = {} for date {}", indexType, response.getVenta(), valueDate);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching dollar rates from DolarApi: {}", e.getMessage(), e);
        }

        return results;
    }

    @Data
    public static class DolarApiResponse {
        private String moneda;
        private String casa;
        private String nombre;
        private BigDecimal compra;
        private BigDecimal venta;
        @JsonProperty("fechaActualizacion")
        private OffsetDateTime fechaActualizacion;
    }
}

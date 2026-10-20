package com.prop_pilot.controller;

import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.ExcelImportExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// No "local" profile here: the local profile swaps in a permit-all SecurityFilterChain,
// so auth checks only mean something against the production chain.
@SpringBootTest
@AutoConfigureMockMvc
class DataPortabilityControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExcelImportExportService excelService;

    @MockBean
    private CurrentUserService currentUserService;

    @Test
    void exportAll_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/data/export"))
            .andExpect(status().isUnauthorized());
    }
}

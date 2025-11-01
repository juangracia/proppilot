package com.prop_pilot.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI propPilotOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PropPilot API")
                        .description("REST API for PropPilot rental property management system")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("PropPilot Team")
                                .email("support@proppilot.com")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Development server")
                ));
    }
}

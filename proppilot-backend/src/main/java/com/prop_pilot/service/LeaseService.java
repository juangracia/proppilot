package com.prop_pilot.service;

import com.prop_pilot.entity.Lease;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.util.List;

public interface LeaseService {

    Lease createLease(@NonNull Lease lease, @NonNull Long ownerId);

    Lease getLeaseById(@NonNull Long id, @NonNull Long ownerId);

    List<Lease> getAllLeases(@NonNull Long ownerId);

    List<Lease> getLeasesByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId);

    List<Lease> getLeasesByTenant(@NonNull Long tenantId, @NonNull Long ownerId);

    List<Lease> getActiveLeases(@NonNull Long ownerId);

    Lease getActiveLeaseByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId);

    Lease getActiveLeaseByTenant(@NonNull Long tenantId, @NonNull Long ownerId);

    Lease updateLease(@NonNull Long id, @NonNull Lease lease, @NonNull Long ownerId);

    void terminateLease(@NonNull Long id, @NonNull Long ownerId);

    void deleteLease(@NonNull Long id, @NonNull Long ownerId);

    boolean hasOverlappingLease(@NonNull Long propertyUnitId, @NonNull LocalDate startDate,
                                @NonNull LocalDate endDate, Long excludeLeaseId);
}

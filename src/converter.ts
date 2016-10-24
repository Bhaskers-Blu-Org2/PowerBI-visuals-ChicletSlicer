/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    import valueFormatter = powerbi.visuals.valueFormatter;
    import converterHelper = powerbi.visuals.converterHelper;
    import ISQExpr = data.ISQExpr;
    import SemanticFilter = data.ISemanticFilter;

    export class ChicletSlicerConverter {
        private dataViewCategorical: DataViewCategorical;
        private dataViewMetadata: DataViewMetadata;
        private category: DataViewCategoryColumn;
        private categoryIdentities: DataViewScopeIdentity[];
        private categoryValues: any[];
        private categoryFormatString: string;
        public identityFields: ISQExpr[];

        public numberOfCategoriesSelectedInData: number;
        public dataPoints: ChicletSlicerDataPoint[];
        private host: IVisualHost;
        public hasSelectionOverride: boolean;

        public constructor(dataView: DataView, host: IVisualHost/*, interactivityService: IInteractivityService*/) {
            var dataViewCategorical = dataView.categorical;
            this.dataViewCategorical = dataViewCategorical;
            this.dataViewMetadata = dataView.metadata;
            this.host = host;

            if (dataViewCategorical.categories && dataViewCategorical.categories.length > 0) {
                this.category = dataViewCategorical.categories[0];
                this.categoryIdentities = this.category.identity;
                this.categoryValues = this.category.values;
                this.identityFields = <ISQExpr[]>this.category.identityFields;
                this.categoryFormatString = valueFormatter.getFormatString(this.category.source, chicletSlicerProps.formatString);
            }

            this.dataPoints = [];

            this.hasSelectionOverride = false;
        }

        private isCategoryColumnSelected(propertyId: DataViewObjectPropertyIdentifier, categories: DataViewCategoricalColumn, idx: number): boolean {
            return categories.objects != null
                && categories.objects[idx]
                && DataViewObjects.getValue<boolean>(categories.objects[idx], propertyId);
        }

        public convert(): void {
            this.dataPoints = [];
            this.numberOfCategoriesSelectedInData = 0;
            // If category exists, we render labels using category values. If not, we render labels
            // using measure labels.
            if (this.categoryValues) {
                var objects = this.dataViewMetadata ? <any>this.dataViewMetadata.objects : undefined;

                var isInvertedSelectionMode = undefined;
                var numberOfScopeIds: number;

                if (objects && objects.general && objects.general.filter) {
                    if (!this.identityFields) {
                        return;
                    }
                    // var filter: SemanticFilter = <SemanticFilter>objects.general.filter;

                    /*
                    var scopeIds = SQExprConverter.asScopeIdsContainer(filter, this.identityFields);
                    if (scopeIds) {
                        isInvertedSelectionMode = scopeIds.isNot;
                        numberOfScopeIds = scopeIds.scopeIds ? scopeIds.scopeIds.length : 0;
                    }
                    else {
                        isInvertedSelectionMode = false;
                    }*/
                }

                var hasSelection: boolean = undefined;

                if (this.dataViewCategorical.values) {
                    for (let idx: number = 0; idx < this.categoryValues.length; idx++) {
                        var selected = this.isCategoryColumnSelected(chicletSlicerProps.selectedPropertyIdentifier, this.category, idx);
                        if (selected != null) {
                            hasSelection = selected;
                            break;
                        }
                    }
                }

                var dataViewCategorical = this.dataViewCategorical;
                var formatStringProp = chicletSlicerProps.formatString;
                var value: number = -Infinity;
                var imageURL: string = '';

                for (var categoryIndex: number = 0, categoryCount = this.categoryValues.length; categoryIndex < categoryCount; categoryIndex++) {
                    //var categoryIdentity = this.category.identity ? this.category.identity[categoryIndex] : null;
                    var categoryIsSelected = this.isCategoryColumnSelected(chicletSlicerProps.selectedPropertyIdentifier, this.category, categoryIndex);
                    var selectable: boolean = true;

                    if (hasSelection != null) {
                        if (isInvertedSelectionMode) {
                            if (this.category.objects == null)
                                categoryIsSelected = undefined;

                            if (categoryIsSelected != null) {
                                categoryIsSelected = hasSelection;
                            }
                            else if (categoryIsSelected == null)
                                categoryIsSelected = !hasSelection;
                        }
                        else {
                            if (categoryIsSelected == null) {
                                categoryIsSelected = !hasSelection;
                            }
                        }
                    }

                    if (categoryIsSelected) {
                        this.numberOfCategoriesSelectedInData++;
                    }

                    var categoryValue = this.categoryValues[categoryIndex];
                    var categoryLabel = valueFormatter.format(categoryValue, this.categoryFormatString);

                    if (this.dataViewCategorical.values) {

                        // Series are either measures in the multi-measure case, or the single series otherwise
                        for (var seriesIndex: number = 0; seriesIndex < this.dataViewCategorical.values.length; seriesIndex++) {
                            var seriesData = dataViewCategorical.values[seriesIndex];
                            if (seriesData.values[categoryIndex] != null) {
                                value = <number>seriesData.values[categoryIndex];
                                if (seriesData.highlights) {
                                    selectable = !(seriesData.highlights[categoryIndex] === null);
                                }
                                if (seriesData.source.groupName && seriesData.source.groupName !== '') {
                                    imageURL = converterHelper.getFormattedLegendLabel(seriesData.source, dataViewCategorical.values, formatStringProp);
                                    if (!/^(ftp|http|https):\/\/[^ "]+$/.test(imageURL)) {
                                        imageURL = undefined;
                                    }
                                }
                            }
                        }
                    }

                    let categorySelectionId: ISelectionId = this.host.createSelectionIdBuilder()
                        .withCategory(this.category, categoryIndex)
                        .createSelectionId();

                    this.dataPoints.push({
                        identity: categorySelectionId as powerbi.visuals.ISelectionId,
                        category: categoryLabel,
                        imageURL: imageURL,
                        value: value,
                        selected: false,
                        selectable: selectable
                    });
                }

                if (numberOfScopeIds != null && numberOfScopeIds > this.numberOfCategoriesSelectedInData) {
                    this.hasSelectionOverride = true;
                }
            }
        }
    }
}
